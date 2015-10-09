/// <reference path="../typings/tsd.d.ts" />

module typewriter {

	interface IWriterAttributes extends ng.IAttributes {
		lines: string;
		printTrigger?: string;
		delay?: string|number;
	}

	interface IWriter {
		lines:string[];
		resultLines:string[];
		doneWritting:boolean;
		delay?:number;
		trigger: () => void;
		printTrigger?: () => void;
	}

	class WriterCtrl implements IWriter {
		lines:string[];
		resultLines:string[];
		delay:number;
		printTrigger:() => void;
		doneWritting:boolean = true;

		private tempLines:string[];

		static $inject = ['$timeout', '$scope', '$attrs'];

		constructor(private $timeout:ng.ITimeoutService,
					private $scope:ng.IScope) {

			$scope.$on('TypewriterLine:done', () => this.appendNextLine(this.tempLines));
		}

		trigger():void {
			this.tempLines = angular.copy(this.lines);
			this.resultLines = [];
			if (this.tempLines)
				this.doneWritting = false;
			this.$scope.$emit('Typewriter:start', this.doneWritting);
			this.appendNextLine(this.tempLines);
		}

		private appendNextLine(lines:string[]):void {
			var line = lines.shift();
			//var delay = Math.round(Math.random() * this.delay);
			this.$timeout(() => {
				if (line != null) {
					this.resultLines.push(line);
				} else {
					this.doneWritting = true;
					this.$scope.$emit('Typewriter:done', this.doneWritting);
				}
			});
		}
	}

	export class WriterDirective implements ng.IDirective {
		restrict = 'E';
		scope = true;
		controller = WriterCtrl;
		controllerAs = 'W';
		bindToController = {
			lines: '=',
			delay: '@?',
			printTrigger: '=?'
		};
		template = "<lines ng-class='{active: !WL.doneWritting}'><tt-line ng-repeat='line in W.resultLines track by $index' text='line' delay='{{W.delay}}'></lines>";

		link($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:IWriterAttributes, W:IWriter) {
			$scope.$watch($attrs.lines, () => W.trigger());
			$scope.$watch($attrs.printTrigger, () => {W.printTrigger = () => W.trigger()});
		}

		static Factory:ng.IDirectiveFactory = () => new WriterDirective();
	}

	angular.module('touk.typewriter', ['touk.typewriter.line'])
		.directive("ttWriter", WriterDirective.Factory);
}