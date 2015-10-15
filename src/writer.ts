/// <reference path="../typings/tsd.d.ts" />
/// <reference path="./line.ts" />

module typewriter {

	interface IWriterAttributes extends ng.IAttributes {
		lines?: string[];
		printTrigger?: string;
		delay?: string|number;
	}

	export interface IWriter {
		elements:typewriter.line.ILine[];
		doneWritting:boolean;
		delay?:number;
		trigger: (lines:typewriter.line.ILine[], force?:boolean) => void;
		printTrigger?: () => void;
		add: (line:typewriter.line.ILine, index?:number) => void;
		remove: (line:typewriter.line.ILine) => void;
		reprint: () => void;
		prev: (element:typewriter.line.ILine) => typewriter.line.ILine;
		clearNext: (index:number) =>void;
		getLineIndex: (line:typewriter.line.ILine) => number;
	}

	class WriterCtrl implements IWriter {
		elements:typewriter.line.ILine[] = [];
		delay:number;
		printTrigger:() => void;
		doneWritting:boolean = null;

		private tempLines:typewriter.line.ILine[];

		static $inject = ['$timeout', '$scope'];
		private timeout:ng.IPromise<void>;

		constructor(private $timeout:ng.ITimeoutService,
					private $scope:ng.IScope) {
			$scope.$watchCollection(() => this.elements, (lines:typewriter.line.ILine[]) => {
				this.trigger(lines);
			});
			$scope.$on('TypewriterLine:start', (event:ng.IAngularEvent, line:typewriter.line.ILine) => {
				this.clearNext(this.getLineIndex(line));
				this.doneWritting = false;
			});
			$scope.$on('TypewriterLine:done', (event:ng.IAngularEvent, line:typewriter.line.ILine) => {
				this.appendNextLine(this.elements, this.getLineIndex(line) + 1);
			});
		}

		trigger(lines:typewriter.line.ILine[], force?:boolean):void {
			this.$timeout.cancel(this.timeout);
			this.$scope.$emit('Typewriter:start', this.doneWritting);
			this.appendNextLine(lines, 0, force);
		}

		add(line:typewriter.line.ILine) {
			this.elements.push(line);
		}

		remove(line:typewriter.line.ILine) {
			this.elements = _.without(this.elements, line);
		}

		getLineIndex(line:typewriter.line.ILine):number {
			return this.elements.indexOf(line);
		}

		reprint() {
			this.trigger(this.elements, true);
		}

		prev(element:typewriter.line.ILine) {
			return this.elements[this.getLineIndex(element)-1];
		}

		clearNext(index:number):void {
			_.forEach(this.elements.slice(index), (line) => line.clear());
		}

		private appendNextLine(lines:typewriter.line.ILine[], index:number, force?:boolean):void {
			var line = lines[index];
			var delay = Math.round(Math.random() * this.delay * 2);

			if (line != null) {
				this.timeout = this.$timeout(() => {
					if (line.doneWritting && !force) {
						this.appendNextLine(this.elements, ++index)
					} else {
						line.display();
					}
				}, delay);
			} else {
				this.doneWritting = true;
				this.$scope.$emit('Typewriter:done', this.doneWritting);
			}
		}
	}

	export class WriterDirective implements ng.IDirective {
		restrict = 'E';
		scope = true;
		controller = WriterCtrl;
		controllerAs = 'W';
		bindToController = {
			delay: '@?',
			lines: '=?',
			printTrigger: '=?'
		};
		transclude = true;
		template = "<lines ng-class='{active: W.doneWritting == false}'>" +
			"<ng-transclude ng-if='!W.lines'></ng-transclude>" +
			"<tt-line ng-repeat='line in W.lines track by $index + \" \" + line'>{{ line }}</tt-line>" +
			"</lines>";

		link($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:IWriterAttributes, W:IWriter) {
			var trigger = () => W.reprint();
			$scope.$watch($attrs.printTrigger, () => W.printTrigger = trigger);
		}

		static Factory:ng.IDirectiveFactory = () => new WriterDirective();
	}

	angular.module('touk.typewriter', ['touk.typewriter.line'])
		.directive("ttWriter", WriterDirective.Factory);
}