/// <reference path="../typings/tsd.d.ts" />
/// <reference path="./line.ts" />

module typewriter {

	interface IWriterAttributes extends ng.IAttributes {
		textLines?: string[];
		printTrigger?: string;
		delay?: string|number;
	}

	export interface IWriter {
		lines:typewriter.line.ILine[];
		doneWritting:boolean;
		delay?:number;
		trigger: (lines:typewriter.line.ILine[], force?:boolean) => void;
		printTrigger?: () => void;
		add: (line:typewriter.line.ILine, index?:number) => void;
		remove: (line:typewriter.line.ILine) => void;
		reprint: () => void;
	}

	class WriterCtrl implements IWriter {
		lines:typewriter.line.ILine[] = [];
		delay:number;
		printTrigger:() => void;
		doneWritting:boolean = true;

		private tempLines:typewriter.line.ILine[];

		static $inject = ['$timeout', '$scope'];
		private timeout:ng.IPromise<void>;

		constructor(private $timeout:ng.ITimeoutService,
					private $scope:ng.IScope) {
			$scope.$watchCollection(() => this.lines, (lines:typewriter.line.ILine[]) => {
				this.trigger(lines);
			});
			$scope.$on('TypewriterLine:done', (event:ng.IAngularEvent, line:typewriter.line.ILine) => {
				this.appendNextLine(this.lines, this.lines.indexOf(line) + 1, true);
			});
		}

		trigger(lines:typewriter.line.ILine[], force?:boolean):void {
			this.$timeout.cancel(this.timeout);
			if (lines)
				this.doneWritting = false;
			this.$scope.$emit('Typewriter:start', this.doneWritting);
			this.appendNextLine(lines, 0, force);
		}

		add(line:typewriter.line.ILine, index?:number) {
			this.lines.splice(index, 0, line);
		}

		remove(line:typewriter.line.ILine) {
			this.lines = _.without(this.lines, line);
		}

		reprint() {
			this.trigger(this.lines, true);
		}

		private appendNextLine(lines:typewriter.line.ILine[], index:number, force?:boolean):void {
			var line = lines[index];
			var delay = Math.round(Math.random() * this.delay * 2);

			if (line != null) {
				this.timeout = this.$timeout(() => {
					if (force || !line.doneWritting) {
						_.forEach(lines.slice(index), (line) => line.clear());
						line.display();
					} else {
						this.appendNextLine(this.lines, ++index)
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
			textLines: '=?',
			printTrigger: '=?'
		};
		transclude = true;
		template = "<lines ng-class='{active: !W.doneWritting}'>" +
			"<ng-transclude ng-if='!W.textLines'></ng-transclude>" +
			"<tt-line ng-repeat='line in W.textLines track by $index + \" \" + line' ng-class='{last: WL.isLast()}' delay='{{W.delay}}'>{{ line }}</tt-line>" +
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